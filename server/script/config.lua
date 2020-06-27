local skynet = require "skynet"
local sharedata = require "skynet.sharedata"


function dump_value_(v)
    if type(v) == "string" then
        v = "\"" .. v .. "\""
    end
    return tostring(v)
end
 
function split(input, delimiter)
    input = tostring(input)
    delimiter = tostring(delimiter)
    if (delimiter == "") then return false end
    local pos, arr = 0, {}
    for st, sp in function() return string.find(input, delimiter, pos, true) end do
        table.insert(arr, string.sub(input, pos, st - 1))
        pos = sp + 1
    end
    table.insert(arr, string.sub(input, pos))
    return arr
end
 
function trim(input)
    return (string.gsub(input, "^%s*(.-)%s*$", "%1"))
end
 
--[[
打印table的工具函数
@params value 需要打印的内容
@params desciption 描述
@params nesting 打印内容的嵌套级数，默认3级
]]
function dump(value, desciption, nesting)
    if type(nesting) ~= "number" then nesting = 3 end
 
    local lookupTable = {}
    local result = {}
 
    local traceback = split(debug.traceback("", 2), "\n")
    -- print("dump from: " .. trim(traceback[3]))
 
    local function dump_(value, desciption, indent, nest, keylen)
        desciption = desciption or "<var>"
        local spc = ""
        if type(keylen) == "number" then
            spc = string.rep(" ", keylen - string.len(dump_value_(desciption)))
        end
        if type(value) ~= "table" then
            result[#result +1 ] = string.format("%s%s%s = %s", indent, dump_value_(desciption), spc, dump_value_(value))
        elseif lookupTable[tostring(value)] then
            result[#result +1 ] = string.format("%s%s%s = *REF*", indent, dump_value_(desciption), spc)
        else
            lookupTable[tostring(value)] = true
            if nest > nesting then
                result[#result +1 ] = string.format("%s%s = *MAX NESTING*", indent, dump_value_(desciption))
            else
                result[#result +1 ] = string.format("%s%s = {", indent, dump_value_(desciption))
                local indent2 = indent.."    "
                local keys = {}
                local keylen = 0
                local values = {}
                for k, v in pairs(value) do
                    keys[#keys + 1] = k
                    local vk = dump_value_(k)
                    local vkl = string.len(vk)
                    if vkl > keylen then keylen = vkl end
                    values[k] = v
                end
                table.sort(keys, function(a, b)
                    if type(a) == "number" and type(b) == "number" then
                        return a < b
                    else
                        return tostring(a) < tostring(b)
                    end
                end)
                for i, k in ipairs(keys) do
                    dump_(values[k], k, indent2, nest + 1, keylen)
                end
                result[#result +1] = string.format("%s}", indent)
            end
        end
    end
    dump_(value, desciption, "- ", 1)
 
    for i, line in ipairs(result) do
        print(line)
    end
end

function log_error(...)
	local t = {...}
	for i = 1,#t do
		t[i] = tostring(t[i])
	end
	local str = table.concat(t," ")
	local info = log_detail() .. str
	local str_stack = debug.traceback(info)
	return clib.log_error(__error_pre,str_stack)
end


local function newobj(name, tbl)
	-- assert(pool[name] == nil, name)
	local cobj = sharedata.new(name, tbl)
	-- sharedata.host.incref(cobj)
	-- local v = { obj = cobj, watch = {} }
	-- objmap[cobj] = v
	-- pool[name] = v
	-- pool_count[name] = { n = 0, threshold = 1000 }
end

local global_tbl = {}

local function InitConfig(path)
	local LAN = {}
	local configPaths = {}

	local function LoadConfig(filename,env)
		local result,msg = loadfile(filename, nil, env)
		if not result then
			log_error("LoadConfig:",filename,msg)
		else
			result,msg = pcall(result)
			if not result then
				log_error("LoadConfig:",filename,msg)
			end
		end
		for name,config in pairs(env) do
			if name ~= "LAN" then
                configPaths[name] = filename
                global_tbl[name] = config
                --CMD.new(name,config)
                -- newobj(name, config)
                -- print(name)
                --dump(config)
			end
        end
	end

	--[[
	local Lang = {}
	for filename in io.popen("ls " .. path .. "/language/zh-cn/*.txt"):lines() do
		LoadConfig(filename, Lang)
	end
	]]

	-- local cmd = string.format("find %s -name *.config",path .. "")
	-- local fp = io.popen(cmd)
	-- for filename in fp:lines() do
	-- 	if not string.find(filename, "language") then
	-- 		LoadConfig(filename,{LAN = LAN})
	-- 	end
	-- end
    -- fp:close()

    function starts(String,Start)
        return string.sub(String,1,string.len(Start))==Start
    end
     
    function ends(String,End)
        return End=='' or string.sub(String,-string.len(End))==End
    end

    local cmd = string.format("dir /S %s /b",path)
    print(cmd)
	local fp = io.popen(cmd)
    for filename in fp:lines() do
        if not string.find(filename, "language") and ends(filename, ".config") then
            -- print(filename)
			LoadConfig(filename,{LAN = LAN})
		end
	end
    fp:close()   
    sharedata.new("GlobalConfig", global_tbl)
end

function CMD.init(namePath, configPath)

end

-- todo call callbacks to registered handlers
function CMD.refresh(name)

end

function CMD.refresh_all()

end

function CMD.new(name, t, ...)

end

function CMD.delete(name)

end

function CMD.update(name, t, ...)

end

skynet.start(function()
    -- skynet.call(sharedata, "lua", "init")
    InitConfig("script\\config")
    -- dump(env)

    -- local r = sharedata.query("GlobalConfig")
    -- dump(r)

    skynet.dispatch("lua", function(_,_, command, ...)
		--skynet.trace()
		local f = CMD[command]
		skynet.ret(skynet.pack(f(...)))
	end)
end)