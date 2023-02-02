from flask import Flask
import requests
from datetime import datetime
import time

app = Flask(__name__)

@app.route("/client", methods=["GET"])
def client():
    now = datetime.now()
    print(f'Sending `A message from CS361` to server at {now.strftime("%H:%M:%S")}')
    get_response = requests.get('http://127.0.0.1:4000/server', data='A message from CS361')
    response_text = get_response.text

    time.sleep(2)
    now = datetime.now()
    print(f'Message received from server at {now.strftime("%H:%M:%S")}: {response_text}')
    return 'success'

if __name__ == "__main__":
    app.run(port=3000, debug=True)
