import random
import time
import os

def generate_number(min_num, max_num):
    with open("num-service.txt", "w") as f:
        random_num = random.randint(min_num,max_num)
        print(f"Random number: {random_num}")
        f.write(f"{random_num}\n")

    print("Listening for input...")

if __name__ == '__main__':
    if not os.path.exists("num-service.txt"):
        with open("num-service.txt", 'w') as new_file:
            pass
    
    print("Listening for input...")
    while True:
        time.sleep(1.0)
        with open("num-service.txt", "r") as f:
            line = f.readline().strip()
        if "," in line:
            min_num, max_num = line.split(',')
            print("Generating random num...")
            generate_number(int(min_num), int(max_num))

# Published Video
# https://media.oregonstate.edu/media/1_xlww1ebh