local tiny = require "tiny"
local skynet = require "skynet"
local system = tiny.processingSystem()

system.filter = tiny.requireAll("dba")

local mongo = require "skynet.db.mongo"

local function _client()
    local config = skynet.call("DBD", "lua", "config")
    local c = mongo.client(
		config
    )
    return c[config.authdb]
end

function system:onAdd(e)
    -- todo connection pool
    local db = _client()

    e.dba.insert = function(self, ...)
        db[self.table]:insert(...);
    end

    e.dba.update = function(self, ...)
        db[self.table]:update(...);
    end

    e.dba.find = function(self, ...)
        return db[self.table]:find(...);
    end

    e.dba.findOne = function(self, ...)
        return db[self.table]:findOne(...);
    end

    e.dba.delete = function(self, ...)
        db[self.table]:delete(...);
    end
end

-- function system:process(e, dt)
--     e.dba:insert({x=1,y=2,b=3,e=4})
--     local r = e.dba:find({x=1,y=2})
--     if r and r:hasNext() then
--         print(r:next().b)
--     end
--     print(e.dba:findOne({x=1,y=2}).b)
--     e.dba:update({x=1,y=2,b=3,e=4}, {x=2,y=3,b=1,e=5})
--     e.dba:delete({x=2,y=3,b=1,e=5})

--     e.dba = nil
--     self.world:addEntity(e);
-- end

return system