local skynet = require "skynet"
local mongo = require "skynet.db.mongo"
local bson = require "bson"

local host, port, db_name, username, password = ...
if port then
	port = math.tointeger(port)
end

-- print(host, port, db_name, username, password)

local function _create_client()
	return mongo.client(
		{
			host = host, port = port,
			username = username, password = password,
			authdb = db_name,
		}
	)
end

function test_auth()
	local ok, err, ret
	local c = mongo.client(
		{
			host = host, port = port,
		}
	)
	local db = c[db_name]
	db:auth(username, password)

	db.testcoll:dropIndex("*")
	db.testcoll:drop()

	ok, err, ret = db.testcoll:safe_insert({test_key = 1});
	assert(ok and ret and ret.n == 1, err)

	ok, err, ret = db.testcoll:safe_insert({test_key = 1});
	assert(ok and ret and ret.n == 1, err)
end

function test_insert_without_index()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	db.testcoll:dropIndex("*")
	db.testcoll:drop()

	ok, err, ret = db.testcoll:safe_insert({test_key = 1});
	assert(ok and ret and ret.n == 1, err)

	ok, err, ret = db.testcoll:safe_insert({test_key = 1});
	assert(ok and ret and ret.n == 1, err)
end

function test_insert_with_index()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	db.testcoll:dropIndex("*")
	db.testcoll:drop()

	db.testcoll:ensureIndex({test_key = 1}, {unique = true, name = "test_key_index"})

	ok, err, ret = db.testcoll:safe_insert({test_key = 1})
	assert(ok and ret and ret.n == 1, err)

	ok, err, ret = db.testcoll:safe_insert({test_key = 1})
	assert(ok == false and string.find(err, "duplicate key error"))
end

function test_find_and_remove()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	db.testcoll:dropIndex("*")
	db.testcoll:drop()

	db.testcoll:ensureIndex({test_key = 1}, {test_key2 = -1}, {unique = true, name = "test_index"})

	ok, err, ret = db.testcoll:safe_insert({test_key = 1, test_key2 = 1})
	assert(ok and ret and ret.n == 1, err)

	ok, err, ret = db.testcoll:safe_insert({test_key = 1, test_key2 = 2})
	assert(ok and ret and ret.n == 1, err)

	ok, err, ret = db.testcoll:safe_insert({test_key = 2, test_key2 = 3})
	assert(ok and ret and ret.n == 1, err)

	ret = db.testcoll:findOne({test_key2 = 1})
	assert(ret and ret.test_key2 == 1, err)

	ret = db.testcoll:find({test_key2 = {['$gt'] = 0}}):sort({test_key = 1}, {test_key2 = -1}):skip(1):limit(1)
	assert(ret:count() == 3)
	assert(ret:count(true) == 1)
	if ret:hasNext() then
		ret = ret:next()
	end
	assert(ret and ret.test_key2 == 1)

	db.testcoll:delete({test_key = 1})
	db.testcoll:delete({test_key = 2})

	ret = db.testcoll:findOne({test_key = 1})
	assert(ret == nil)
end

function test_expire_index()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	db.testcoll:dropIndex("*")
	db.testcoll:drop()

	db.testcoll:ensureIndex({test_key = 1}, {unique = true, name = "test_key_index", expireAfterSeconds = 1, })
	db.testcoll:ensureIndex({test_date = 1}, {expireAfterSeconds = 1, })

	ok, err, ret = db.testcoll:safe_insert({test_key = 1, test_date = bson.date(os.time())})
	assert(ok and ret and ret.n == 1, err)

	ret = db.testcoll:findOne({test_key = 1})
	assert(ret and ret.test_key == 1)

	for i = 1, 60 do
		skynet.sleep(100);
		print("check expire", i)
		ret = db.testcoll:findOne({test_key = 1})
		if ret == nil then
			return
		end
	end
	print("test expire index failed")
	assert(false, "test expire index failed");
end


local function dump(obj)
    local getIndent, quoteStr, wrapKey, wrapVal, dumpObj
    getIndent = function(level)
        return string.rep("\t", level)
    end
    quoteStr = function(str)
        return '"' .. string.gsub(str, '"', '\\"') .. '"'
    end
    wrapKey = function(val)
        if type(val) == "number" then
            return "[" .. val .. "]"
        elseif type(val) == "string" then
            return "[" .. quoteStr(val) .. "]"
        else
            return "[" .. tostring(val) .. "]"
        end
    end
    wrapVal = function(val, level)
        if type(val) == "table" then
            return dumpObj(val, level)
        elseif type(val) == "number" then
            return val
        elseif type(val) == "string" then
            return quoteStr(val)
        else
            return tostring(val)
        end
    end
    dumpObj = function(obj, level)
        if type(obj) ~= "table" then
            return wrapVal(obj)
        end
        level = level + 1
        local tokens = {}
        tokens[#tokens + 1] = "{"
        for k, v in pairs(obj) do
            tokens[#tokens + 1] = getIndent(level) .. wrapKey(k) .. " = " .. wrapVal(v, level) .. ","
        end
        tokens[#tokens + 1] = getIndent(level - 1) .. "}"
        return table.concat(tokens, "\n")
    end
    return dumpObj(obj, 0)
end

function write_millions()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	local num = 100000

	db.testcoll:dropIndex("*")
	db.testcoll:drop()

	db.testcoll:createIndex({{x = 1}, {y = 1},unique = true, background= true, name = "test_key_index"})

	local b1={};
	local b2={};
	local e1={};
	local e2={};
	for i = 1, 256 do
		if i % 2 == 0 then
			b1[i]={id=i};
		else
			b1[i]={};
		end
		b2[i]={id=i};
		e1[i]={id=i,x=i,y=i};
		if i <= 128 then
			e2[i]={id=i,x=i,y=i};
		end
	end
	print("inserting")
	local t1 = skynet.now()
	for i = 1, num do
		if i % 2000 == 0 then
			print(i)
		end
		if i % 2 == 0 then
			ok, err, ret = db.testcoll:insert({x=i,y=i,b=b1,e=e1});
		else
			ok, err, ret = db.testcoll:insert({x=i,y=i,b=b2,e=e2});
		end
	end
	local t2 = skynet.now()
	local tps = num / ((t2 - t1) * 0.01)
	print("write tps:"..tps)
end

function write_more()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	local num = 300000
	
	local b={};
	local e={};
	for i = 1, 256 do
		b[i]={id=i};
		e[i]={id=i,x=i,y=i};
	end

	local old = db.testcoll:find():sort({x=-1}):limit(1)

	local start = 1;
	if old:hasNext() then
		start = old:next().x+1
	end
	print("inserting "..start)
	local t1 = skynet.now()
	for i = start, start+num do
		if i % 2000 == 0 then
			print(i)
		end
		ok, err, ret = db.testcoll:insert({x=i,y=i,b=b,e=e});
	end
	local t2 = skynet.now()
	local tps = num / ((t2 - t1) * 0.01)
	print("write tps:"..tps)
end

function read_millions_empty()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	local num = 5000

	local t1 = skynet.now()
	local t2 = skynet.now()
	local tps = num / ((t2 - t1) * 0.01)
	local save = {}

	print("start read")
	t1 = skynet.now()
	for i = 1, num do
		if i % 2000 == 0 then
			print(i)
		end
		ret = db.testcoll:find({x = -1, y = -1}):limit(1)

		if ret:hasNext() then
			ret = ret:next()
			assert(ret.x == i)
		end
	end
	t2 = skynet.now()
	tps = num / ((t2 - t1) * 0.01)
	print("read tps:"..tps)
end

function read_millions()
	local ok, err, ret
	local c = _create_client()
	local db = c[db_name]

	local num = 5000

	local t1 = skynet.now()
	local t2 = skynet.now()
	local tps = num / ((t2 - t1) * 0.01)
	local save = {}

	print("start read")
	t1 = skynet.now()
	for i = 1, num do
		if i % 2000 == 0 then
			print(i)
		end
		ret = db.testcoll:find({x = i, y = i}):limit(1)

		-- save.r = ret
		-- print(dump(ret.test_key))
		-- assert(ret:count() == 1)
		if ret:hasNext() then
			ret = ret:next()
			assert(ret.x == i)
		end
		-- assert(ret.test_key == i)
	end
	t2 = skynet.now()
	tps = num / ((t2 - t1) * 0.01)
	print("read tps:"..tps)
end

skynet.start(function()
	if username then
		-- print("Test auth")
		-- test_auth()
	end
	print("Test millions data")
	write_millions()
	-- write_more()
	-- read_millions()
	-- read_millions_empty()
	-- print("Test insert without index")
	-- test_insert_without_index()
	-- print("Test insert index")
	-- test_insert_with_index()
	-- print("Test find and remove")
	-- test_find_and_remove()
	-- print("Test expire index")
	-- test_expire_index()
	-- print("mongodb test finish.");
end)
