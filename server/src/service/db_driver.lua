local skynet = require "skynet"
require "skynet.manager"	-- import skynet.register

local mongo = require "skynet.db.mongo"
local bson = require "bson"

local host, port, db_name, username, password = ...
if port then
	port = math.tointeger(port)
end

local map = {}

--connection pool
local connection = {}

local command = {}

function command.GET(key)
	return map[key]
end

function command.SET(key, value)
	local last = map[key]
	map[key] = value
	return last
end

function command.CLIENT()
	local c = mongo.client(
		{
			host = host, port = port,
			username = username, password = password,
			authdb = db_name,
		}
    )
    return c[db_name]
end

function command.CONFIG()
	return {
			host = host, port = port,
			username = username, password = password,
			authdb = db_name,
    }
end

function command.INSERT(table, ...)
	map.db[table]:insert(...)
end

function command.DELETE(table, ...)
	map.db[table]:delete(...)
end

function command.FIND(t, ...)
	local r = map.db[t]:find(...)
	local arr = {}
	while r:hasNext() do
		table.insert(arr, r:next())
	end
	return arr
end

function command.FINDONE(table, ...)
	return map.db[table]:findOne(...)
end

function command.UPDATE(table, ...)
	map.db[table]:update(...)
end

skynet.start(function()
	local c = mongo.client(
		{
			host = host, port = port,
			username = username, password = password,
			authdb = db_name,
		}
    )

	map.db = c[db_name]

	skynet.dispatch("lua", function(session, address, cmd, ...)
		cmd = cmd:upper()
		if cmd == "PING" then
			assert(session == 0)
			local str = (...)
			if #str > 20 then
				str = str:sub(1,20) .. "...(" .. #str .. ")"
			end
			skynet.error(string.format("%s ping %s", skynet.address(address), str))
			return
		end
		local f = command[cmd]
		if f then
			skynet.ret(skynet.pack(f(...)))
		else
			error(string.format("Unknown command %s", tostring(cmd)))
		end
    end)
    
	skynet.register "DBD"
end)
