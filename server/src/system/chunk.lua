local tiny = require "tiny"
local skynet = require "skynet"

local system = tiny.processingSystem()
local db = require "utility.db"
local table = "chunk"

system.filter = tiny.requireAll("chunk")
-- update interval, less than 3 will cause bug
system.interval = 100

function system:process(e, dt)
    local q = {x=e.chunk.x,y=e.chunk.y}
    local r = db.findOne(table, q)
    if r == nil then
        -- e.dba:delete(q)
        db.insert(table, e.chunk)
        skynet.sleep(30)

        r = db.findOne(table, q)
    end
    
    print("chunk blocks:", #r.b, "entities:", #r.e)
    e.chunk = nil
    self.world:addEntity(e)
end

return system