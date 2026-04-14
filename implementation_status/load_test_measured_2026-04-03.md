# Load test measurements (local)
Date: 2026-04-03T19:45:44+04:00
Environment: Docker `web`, RAILS_ENV=development (host networking, port 3000)

> Исторический архив замеров до перехода на RU-only URL-схему без префикса.
> В этом файле сырые логи ApacheBench сохранены в исходном виде (`/ru/...`).
> Актуальные эквиваленты маршрутов:
> - `/ru/` -> `/`
> - `/ru/products` -> `/products`
> - `/ru/products/:id` -> `/products/:id`
> - `/ru/cart` -> `/cart`
> - `/ru/users/sign_in` -> `/users/sign_in`

## Baseline (curl, single request)
- `/up`: **0.019835s**
- `/ru`: **0.389891s**
- `/ru/products`: **0.291317s**
- `/ru/products/1`: **0.095204s**

## Apache Bench (keep-alive -k)
### GET /ru/ — n=1000 c=10
This is ApacheBench, Version 2.3 <$Revision: 1923142 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            3000

Document Path:          /ru/
Document Length:        62305 bytes

Concurrency Level:      10
Time taken for tests:   162.130 seconds
Complete requests:      1000
Failed requests:        0
Keep-Alive requests:    1000
Total transferred:      64215530 bytes
HTML transferred:       62305000 bytes
Requests per second:    6.17 [#/sec] (mean)
Time per request:       1621.296 [ms] (mean)
Time per request:       162.130 [ms] (mean, across all concurrent requests)
Transfer rate:          386.79 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.0      0       1
Processing:   122 1616 350.4   1561    2975
Waiting:      121 1615 350.4   1561    2975
Total:        122 1616 350.4   1561    2975

Percentage of the requests served within a certain time (ms)
  50%   1561
  66%   1757
  75%   1861
  80%   1920
  90%   2059
  95%   2176
  98%   2425
  99%   2578
 100%   2975 (longest request)

### GET /ru/products — n=1000 c=10
This is ApacheBench, Version 2.3 <$Revision: 1923142 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            3000

Document Path:          /ru/products
Document Length:        88416 bytes

Concurrency Level:      10
Time taken for tests:   208.555 seconds
Complete requests:      1000
Failed requests:        0
Keep-Alive requests:    1000
Total transferred:      90403832 bytes
HTML transferred:       88416000 bytes
Requests per second:    4.79 [#/sec] (mean)
Time per request:       2085.551 [ms] (mean)
Time per request:       208.555 [ms] (mean, across all concurrent requests)
Transfer rate:          423.32 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       1
Processing:   204 2076 292.1   2118    2883
Waiting:      203 2076 292.1   2118    2883
Total:        205 2076 292.1   2118    2883

Percentage of the requests served within a certain time (ms)
  50%   2118
  66%   2214
  75%   2279
  80%   2320
  90%   2401
  95%   2473
  98%   2638
  99%   2692
 100%   2883 (longest request)

### GET /ru/products/1 — n=1000 c=10
This is ApacheBench, Version 2.3 <$Revision: 1923142 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Completed 900 requests
Completed 1000 requests
Finished 1000 requests


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            3000

Document Path:          /ru/products/1
Document Length:        41149 bytes

Concurrency Level:      10
Time taken for tests:   199.702 seconds
Complete requests:      1000
Failed requests:        0
Keep-Alive requests:    1000
Total transferred:      43015826 bytes
HTML transferred:       41149000 bytes
Requests per second:    5.01 [#/sec] (mean)
Time per request:       1997.017 [ms] (mean)
Time per request:       199.702 [ms] (mean, across all concurrent requests)
Transfer rate:          210.35 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.1      0       1
Processing:    88 1990 2107.9   1758   20240
Waiting:       87 1990 2107.1   1758   20239
Total:         88 1990 2107.9   1758   20240

Percentage of the requests served within a certain time (ms)
  50%   1758
  66%   1932
  75%   2039
  80%   2118
  90%   2307
  95%   2453
  98%  10509
  99%  16669
 100%  20240 (longest request)

### GET /ru/products — n=5000 c=30 (heavy)
This is ApacheBench, Version 2.3 <$Revision: 1923142 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 500 requests
Completed 1000 requests
Completed 1500 requests

---

## Дополнительные замеры (досняты после прерывания n=5000)
Первый прогон оборвался на **1500/5000** запросов к `/ru/products` (c=30). Ниже — полные короткие сценарии.

### GET /ru/products — n=800 c=30
This is ApacheBench, Version 2.3 <$Revision: 1923142 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
Completed 200 requests
Completed 300 requests
Completed 400 requests
Completed 500 requests
Completed 600 requests
Completed 700 requests
Completed 800 requests
Finished 800 requests


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            3000

Document Path:          /ru/products
Document Length:        88416 bytes

Concurrency Level:      30
Time taken for tests:   267.912 seconds
Complete requests:      800
Failed requests:        0
Keep-Alive requests:    800
Total transferred:      72324991 bytes
HTML transferred:       70732800 bytes
Requests per second:    2.99 [#/sec] (mean)
Time per request:       10046.687 [ms] (mean)
Time per request:       334.890 [ms] (mean, across all concurrent requests)
Transfer rate:          263.63 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.4      0       3
Processing:   267 9930 6352.4   7706   41812
Waiting:      263 9929 6352.1   7706   41812
Total:        267 9930 6352.3   7706   41812

Percentage of the requests served within a certain time (ms)
  50%   7706
  66%  10063
  75%  10959
  80%  11716
  90%  13242
  95%  14057
  98%  40251
  99%  41103
 100%  41812 (longest request)

### GET /ru/ — n=400 c=50
This is ApacheBench, Version 2.3 <$Revision: 1923142 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient)
Completed 100 requests
