local tiny = require "tiny"

local hair = tiny.processingSystem()

hair.filter = tiny.requireAll("name", "hairColor")

function hair:process(e, dt)
    if e.hairColor ~= '' then
        print(("%s who had %s hair now has none"):format(e.name, e.hairColor))
        e.hairColor = ''
    end
end

return hair