local tiny = require "tiny"

local hair = tiny.processingSystem()

hair.filter = tiny.requireAll("name", "hairColor")

function hair:process(e, dt)
    print(("%s who has %s hair"):format(e.name, e.hairColor))
end

return hair