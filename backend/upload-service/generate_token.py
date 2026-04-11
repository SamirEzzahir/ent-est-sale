from jose import jwt
import os
import sys

SECRET = os.getenv("JWT_SECRET", "dev-secret-key")

def generate_tokens(username_teacher="teacher1", username_student="student1"):
    """Generate test JWT tokens for different roles."""
    teacher_token = jwt.encode(
        {"sub": username_teacher, "role": "teacher"}, 
        SECRET, 
        algorithm="HS256"
    )
    student_token = jwt.encode(
        {"sub": username_student, "role": "student"}, 
        SECRET, 
        algorithm="HS256"
    )
    
    print(f"TEACHER ({username_teacher}): {teacher_token}")
    print(f"STUDENT ({username_student}): {student_token}")
    return teacher_token, student_token

if __name__ == "__main__":
    username_teacher = sys.argv[1] if len(sys.argv) > 1 else "teacher1"
    username_student = sys.argv[2] if len(sys.argv) > 2 else "student1"
    generate_tokens(username_teacher, username_student)