from flask import Flask, request
from datetime import datetime
import time

app = Flask(__name__)

json_data = {"message": "A message from CS361", "instance": "server"}

@app.route("/server", methods=["GET"])
def server():
    time.sleep(2)
    data_received = request.data.decode()
    now = datetime.now()

    print(f'Message received from client at {now.strftime("%H:%M:%S")}: `{data_received}`')


    time.sleep(2)
    now = datetime.now()
    print(f'Sending message back to client at {now.strftime("%H:%M:%S")}...')

    return 'A message from CS361'


if __name__ == "__main__":
    app.run(port=4000, debug=True)
