local tiny = require "tiny"

local hair = tiny.processingSystem()

hair.filter = tiny.requireAll("name", "hairColor")

function hair:process(e, dt)
    print(("%s who had %s hair now has none"):format(e.name, e.hairColor))
    e.hairColor = nil

    -- tell world we have changed the entity
    self.world:addEntity(e)
end

return hair