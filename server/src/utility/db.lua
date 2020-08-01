local skynet = require "skynet"

local db = {}

function db.insert(...)
    skynet.call("DBD", "lua", "insert", ...)
end

function db.delete(...)
    skynet.call("DBD", "lua", "delete", ...)
end

function db.find(...)
    return skynet.call("DBD", "lua", "find", ...)
end

function db.findOne(...)
    return skynet.call("DBD", "lua", "findOne", ...)
end

function db.update(...)
    skynet.call("DBD", "lua", "update", ...)
end

return db