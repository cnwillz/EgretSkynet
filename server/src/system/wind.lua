local tiny = require "tiny"

local system = tiny.processingSystem()

system.filter = tiny.requireAll("position")

function system:process(e, dt)
    print("wind blows, position ("..e.position.x..","..e.position.y..")")
    e.position.x = e.position.x + 1

    if e.position.x > 5 then
        e.position = nil
        e.name = "shape"
        e.hairColor = "white"
        print("shape has hair now")

        self.world:addEntity(e)
    end
end

return system