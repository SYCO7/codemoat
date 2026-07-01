import subprocess


def run_report(user_input):
    subprocess.Popen("echo " + user_input, shell=True)


GITHUB_TOKEN = "ghp_16C7e42F292c6912E7710c838347Ae178B4a"
