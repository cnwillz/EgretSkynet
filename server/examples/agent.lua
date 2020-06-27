local skynet = require "skynet"
local sharedata = require "skynet.sharedata"

local sproto = require "sproto"
local sprotoloader = require "sprotoloader"

local WATCHDOG
local GATE
local host
local host_send_request

local CMD = {}
local REQUEST = {}
local RESPONSE = {}
local client_fd
local session_id = 0
local session_callback = {}

local config

function REQUEST:get()
	print("get", self.what)
	local r = skynet.call("SIMPLEDB", "lua", "get", self.what)
	return { result = r }
end

function REQUEST:set()
	print("set", self.what, self.value)
	local r = skynet.call("SIMPLEDB", "lua", "set", self.what, self.value)
end

function REQUEST:handshake()
	return { msg = "Welcome to skynet, I will send heartbeat every 5 sec." }
end

function REQUEST:say()
	print("say", self.msg)
end

function REQUEST:quit()
	skynet.call(WATCHDOG, "lua", "close", client_fd)
end

local function request(name, args, response)
	local f = assert(REQUEST[name])
	local r = f(args)
	print("request:::", name, args, response)
	if response then
		return response(r)
	end
end

function RESPONSE:auth()
	print("auth token get: ".. self.token)
end

local function response(session, args)
	print("response:::", session, args)
	local f = assert(session_callback[session])
	local r = f(args)
	session_callback[session] = nil
end

local function send_package(pack)
	--local package = string.pack(">s2", pack)
	--socket.write(client_fd, package)
	skynet.call(GATE, "lua", "write", client_fd, pack)
end

skynet.register_protocol {
	name = "client",
	id = skynet.PTYPE_CLIENT,
	unpack = function (msg, sz)
		return host:dispatch(msg, sz)
	end,
	dispatch = function (fd, _, type, ...)
		assert(fd == client_fd)	-- You can use fd to reply message
		skynet.ignoreret()	-- session is fd, don't call skynet.ret
		--skynet.trace()
		if type == "REQUEST" then
			local ok, result  = pcall(request, ...)
			if ok then
				if result then
					send_package(result)
				end
			else
				skynet.error(result)
			end
		else
			assert(type == "RESPONSE")
			--error "This example doesn't support request client"
			local ok, err = pcall(response, ...)
			if not ok then
				print(tostring(err))
			end
		end
	end
}

function send_request(p, data)
	if RESPONSE[p] then
		session_id = session_id + 1
		session_callback[session_id] = RESPONSE[p]
		send_package(host_send_request(p, data, session_id))
	else
		send_package(host_send_request(p, data))
	end
end

function CMD.start(conf)
	local fd = conf.client
	client_fd = fd

	local gate = conf.gate
	WATCHDOG = conf.watchdog
	GATE = gate
	-- slot 1,2 set at main.lua
	host = sprotoloader.load(1):host "package"
	host_send_request = host:attach(sprotoloader.load(2))
	send_request("auth", nil)
	skynet.fork(function()
		while true do
			send_request("heartbeat")
			skynet.sleep(500)
		end
	end)
	
	skynet.call(gate, "lua", "forward", fd)
end

function CMD.disconnect()
	-- todo: do something before exit
	skynet.exit()
end

skynet.start(function()
	skynet.dispatch("lua", function(_,_, command, ...)
		--skynet.trace()
		local f = CMD[command]
		skynet.ret(skynet.pack(f(...)))
	end)

	config = sharedata.query("GlobalConfig")
	print("config:"..config.BiomesConfig[3].id)
end)
