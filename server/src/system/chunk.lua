local tiny = require "tiny"

local system = tiny.processingSystem()

system.filter = tiny.requireAll("chunk")
-- update interval, less than 3 will cause bug
system.interval = 100

function system:onAdd(e)
    if e.dba == nil then
        e.dba = { table = "chunk"}
        self.world:addEntity(e)
    end
end

function system:process(e, dt)
    local q = {x=e.chunk.x,y=e.chunk.y}
    local r = e.dba:findOne(q)
    if r ~= nil then
        e.dba:delete(q)
        e.dba:insert(e.chunk)
    end
    
    r = e.dba:findOne(q)
    print("chunk blocks:", #r.b, "entities:", #r.e)
    e.chunk = nil
    self.world:addEntity(e)
end

return system