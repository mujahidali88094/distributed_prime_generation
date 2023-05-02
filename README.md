# distributed_prime_generation
## Worker Microservice
Its a Restful microservice that
1) generates prime numbers from and to given parameters as a background service.
2) gives you prime numbers generated so far.
3) monitors the CPU and Memory Usage.
## Master Microservice
Its a microservice that 
1) assigns work to worker microservice.
2) arranges lists from workers into one.
2) logs resource usage to a csv file.
## Objective
To practice dockerization and handling multiple containers.
