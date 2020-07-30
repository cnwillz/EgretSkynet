local tiny = require "tiny"

local talking = tiny.processingSystem()

talking.filter = tiny.requireAll("name", "mass", "phrase")

function talking:process(e, dt)
    e.mass = e.mass + dt * 10
    print(("%s who weighs %d pounds, says %q."):format(e.name, e.mass, e.phrase))
    if e.mass >= 300 then
        print(e.name.. " doesn't want to talk any more")
        e.phrase = nil
        self.world:addEntity(e)
    end
end

return talking