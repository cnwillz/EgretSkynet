local tiny = require "tiny"

local system = tiny.processingSystem()

system.filter = tiny.requireAll("rect")

function system:process(e, dt)
    print("The area of Rectangle is "..e.rect.area)
    e.rect = nil
    self.world:addEntity(e)
end

return system