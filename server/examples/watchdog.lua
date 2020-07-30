local skynet = require "skynet"

local CMD = {}
local SOCKET = {}
local gate
local agent = {}

local config
local system

local MODE = ...

function SOCKET.open(fd, addr)
	skynet.error("New client from : " .. addr)
	agent[fd] = skynet.newservice("agent")
	skynet.call(agent[fd], "lua", "start", { gate = gate, client = fd, watchdog = skynet.self() })
end

local function close_agent(fd)
	local a = agent[fd]
	agent[fd] = nil
	if a then
		skynet.call(gate, "lua", "kick", fd)
		-- disconnect never return
		skynet.send(a, "lua", "disconnect")
	end
end

function SOCKET.close(fd)
	print("socket close",fd)
	close_agent(fd)
end

function SOCKET.error(fd, msg)
	print("socket error",fd, msg)
	close_agent(fd)
end

function SOCKET.warning(fd, size)
	-- size K bytes havn't send out in fd
	print("socket warning", fd, size)
end

function SOCKET.data(fd, msg)
end

function CMD.start(conf)
	skynet.call(gate, "lua", "open" , conf)
end

function CMD.close(fd)
	close_agent(fd)
end

skynet.start(function()
	skynet.dispatch("lua", function(session, source, cmd, subcmd, ...)
		if cmd == "socket" then
			local f = SOCKET[subcmd]
			f(...)
			-- socket api don't need return
		else
			local f = assert(CMD[cmd])
			skynet.ret(skynet.pack(f(subcmd, ...)))
		end
	end)

	gate = skynet.newservice("gate", MODE)
	config = skynet.newservice("config")
	system = skynet.newservice("root_system")
	skynet.call(system, "lua", "init")

	skynet.fork(function()
		local STRANDARD_TICK_TIME = 5
		local lastTime = skynet.now()
		local nowTime = 0
		local passedTime = 0
		local delta = 0

		print("server tick rate", 100 / STRANDARD_TICK_TIME)

		while true do
			nowTime = skynet.now()
			delta = nowTime - lastTime 
			lastTime = nowTime
			skynet.call(system, "lua", "tick", delta)
			passedTime = skynet.now() - lastTime
			if passedTime < STRANDARD_TICK_TIME then
				skynet.sleep(STRANDARD_TICK_TIME - passedTime)
			else
				-- tick rate lower than 20 calc them
				-- TODO 1s 1m 10m
				local rate = 100 / passedTime
			end
		end
	end)
end)
