local tiny = require "tiny"
local skynet = require "skynet"

local system = tiny.processingSystem()
local db = require "utility.db"
local db_table = "chunk"

system.filter = tiny.requireAll("chunk")
-- update interval, less than 3 will cause bug
system.interval = 100

function system:process(e, dt)
    if e.chunk.data == nil then
        local q = {x=e.chunk.x,y=e.chunk.y}
        local r = db.findOne(db_table, q)
        if r == nil then
            local b={}
            local es={}
            for i = 1, 256 do
                b[i]={id=i}
                if i % 2 == 0 then
                    table.insert(es, {id=i,x=i,y=i})
                    -- e[i/2]={id=i,x=i,y=i}
                end
            end
            db.insert(db_table, {x=e.chunk.x,y=e.chunk.y, b = b, e= es})
            skynet.sleep(30)

            r = db.findOne(db_table, q)
        end
        e.chunk.data = r
    end
    print("chunk blocks:", #e.chunk.data.b, "entities:", #e.chunk.data.e)
    e.chunk = nil
    self.world:addEntity(e)
end

return system