local tiny = require "tiny"

local system = tiny.processingSystem()

system.filter = tiny.requireAll("rect")

function system:process(e, dt)
    if e.rect ~= nil then
        print("The area of Rectangle is "..e.rect.area)
        e.rect = nil
    end
end

return system