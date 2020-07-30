local tiny = require "tiny"

local talkingSystem = tiny.processingSystem()

talkingSystem.filter = tiny.requireAll("name", "mass", "phrase")

function talkingSystem:process(e, dt)
    e.mass = e.mass + dt * 3
    print(("%s who weighs %d pounds, says %q."):format(e.name, e.mass, e.phrase))
end

return talkingSystem