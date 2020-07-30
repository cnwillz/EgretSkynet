local tiny = require "tiny"

local system = tiny.processingSystem()

system.filter = tiny.requireAll("position")

function system:process(e, dt)
    if e.position.x < 5 then
        print("wind blows, position ("..e.position.x..","..e.position.y..")")
        e.position.x = e.position.x + 1
    end
end

return system