"""
Test runner reference for the project.

Run all tests:
    /home/aaila/Documents/Development/FYP2/venv/bin/python manage.py test

Run all tests with coverage (if coverage is installed):
    coverage run manage.py test
    coverage report -m

Test files across apps:
    - account/tests.py
    - exercises/tests.py
    - medicals/tests.py
    - videos/tests.py
    - sessions/tests.py
    - feedback/tests.py
"""

TEST_COMMAND_ALL = "/home/aaila/Documents/Development/FYP2/venv/bin/python manage.py test"
TEST_COMMAND_COVERAGE = "coverage run manage.py test && coverage report -m"

TEST_FILES = [
    "account/tests.py",
    "exercises/tests.py",
    "medicals/tests.py",
    "videos/tests.py",
    "sessions/tests.py",
    "feedback/tests.py",
]


def print_test_guide():
    print("Run all tests:")
    print(f"  {TEST_COMMAND_ALL}")
    print("\nRun with coverage (if installed):")
    print(f"  {TEST_COMMAND_COVERAGE}")
    print("\nTest files:")
    for test_file in TEST_FILES:
        print(f"  - {test_file}")


if __name__ == "__main__":
    print_test_guide()
