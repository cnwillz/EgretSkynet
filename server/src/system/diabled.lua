local tiny = require "tiny"

local system = tiny.processingSystem()

system.filter = tiny.requireAll("name")
system.active = false

function system:process(e, dt)
    print("disabled system ")
end

return system