-- getJob
-- KEYS[1] job name

local objName = 'curator:jobs'

local count = redis.call('hget', objName, KEYS[1])

if count != 0 then
  local res = redis.call('hdel', objName, KEYS[1])
  return 'success'
end

return 'fail'
