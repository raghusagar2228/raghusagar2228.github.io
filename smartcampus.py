import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

students = []
DATA_FILE = "student_records.json"


def calculate_grade(avg):
    if avg >= 90:
        return "A"
    elif avg >= 75:
        return "B"
    elif avg >= 60:
        return "C"
    elif avg >= 40:
        return "D"
    else:
        return "F"


def register_student():
    print("\n===== STUDENT REGISTRATION =====")
    sid = input("Enter Student ID: ")
    name = input("Enter Student Name: ")
    age = int(input("Enter Age: "))
    department = input("Enter Department: ")

    print("\nEnter marks of 3 subjects")
    m1 = float(input("Subject 1: "))
    m2 = float(input("Subject 2: "))
    m3 = float(input("Subject 3: "))

    average = (m1 + m2 + m3) / 3
    grade = calculate_grade(average)

    student = {
        "ID": sid,
        "Name": name,
        "Age": age,
        "Department": department,
        "Marks": [m1, m2, m3],
        "Average": average,
        "Grade": grade,
        "Courses": []
    }

    students.append(student)

    print("\nStudent Registered Successfully")
    print("Average:", round(average, 2))
    print("Grade:", grade)


def display_students():
    if not students:
        print("No student records found.")
        return

    print("\n===== STUDENT RECORDS =====")

    for s in students:
        print("--------------------------------")
        print("ID:", s["ID"])
        print("Name:", s["Name"])
        print("Age:", s["Age"])
        print("Department:", s["Department"])
        print("Marks:", s["Marks"])
        print("Average:", round(s["Average"], 2))
        print("Grade:", s["Grade"])
        print("Courses:", s["Courses"])


def enroll_course():
    sid = input("Enter Student ID: ")

    for s in students:
        if s["ID"] == sid:
            print("\nAvailable Courses")
            print("1. Python")
            print("2. Data Science")
            print("3. AI")
            print("4. Mathematics")

            course = input("Enter Course Name: ")
            s["Courses"].append(course)

            print("Course enrolled successfully.")
            return

    print("Student not found.")


def search_student():
    sid = input("Enter Student ID to search: ")

    for s in students:
        if s["ID"] == sid:
            print("\nStudent Found")
            print("Name:", s["Name"])
            print("Department:", s["Department"])
            print("Grade:", s["Grade"])
            return

    print("Student not found.")


def sort_students():
    print("\n1. Sort by Name")
    print("2. Sort by Average Marks")

    choice = int(input("Enter choice: "))

    if choice == 1:
        sorted_students = sorted(students, key=lambda x: x["Name"])
    elif choice == 2:
        sorted_students = sorted(
            students,
            key=lambda x: x["Average"],
            reverse=True
        )
    else:
        print("Invalid choice")
        return

    print("\n===== SORTED RECORDS =====")

    for s in sorted_students:
        print(
            s["ID"],
            "-",
            s["Name"],
            "-",
            round(s["Average"], 2)
        )


def calculate_fee():
    print("\n===== FEE CALCULATION =====")

    tuition_fee = float(input("Enter Tuition Fee: "))
    lab_fee = float(input("Enter Lab Fee: "))
    exam_fee = float(input("Enter Exam Fee: "))

    total = tuition_fee + lab_fee + exam_fee

    print("Total Fee =", total)


def scan_directory():
    path = input("Enter directory path: ").strip()

    if not path:
        path = "."

    try:
        files = os.listdir(path)

        print(f"\nFiles in '{os.path.abspath(path)}':")

        for file in files:
            print("-", file)

    except FileNotFoundError:
        print("Directory not found.")
    except PermissionError:
        print("Permission denied.")
    except Exception as e:
        print("Error:", e)


def performance_analytics():
    if not students:
        print("No student data available.")
        return

    print("\n===== PERFORMANCE ANALYTICS =====")

    names = []
    averages = []

    for s in students:
        names.append(s["Name"])
        averages.append(s["Average"])

    avg_array = np.array(averages)

    print("Highest Average:", np.max(avg_array))
    print("Lowest Average:", np.min(avg_array))
    print("Class Average:", np.mean(avg_array))

    df = pd.DataFrame({
        "Name": names,
        "Average": averages
    })

    print("\nStudent Performance Table")
    print(df)

    plt.figure(figsize=(8, 5))
    plt.bar(names, averages)
    plt.xlabel("Students")
    plt.ylabel("Average Marks")
    plt.title("Student Performance Analysis")
    plt.grid(axis='y')
    plt.show()


def main_menu():
    while True:
        print("\n")
        print("===================================")
        print(" SMART CAMPUS INFORMATION SYSTEM")
        print("===================================")
        print("1. Register Student")
        print("2. Display Students")
        print("3. Enroll Course")
        print("4. Search Student")
        print("5. Sort Students")
        print("6. Calculate Fee")
        print("7. Scan Directory")
        print("8. Performance Analytics")
        print("9. Exit")

        choice = input("Enter your choice: ")

        if choice == "1":
            register_student()

        elif choice == "2":
            display_students()

        elif choice == "3":
            enroll_course()

        elif choice == "4":
            search_student()

        elif choice == "5":
            sort_students()

        elif choice == "6":
            calculate_fee()

        elif choice == "7":
            scan_directory()

        elif choice == "8":
            performance_analytics()

        elif choice == "9":
            print("Exiting Program...")
            break

        else:
            print("Invalid choice. Try again.")


main_menu()