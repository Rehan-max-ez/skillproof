# SkillProof Setup Guide (For New Users)

Follow these steps to run the SkillProof backend on your laptop.

---

## 1. Clone the Repository

Open **Terminal or PowerShell** and run:

git clone https://github.com/YOUR_USERNAME/skillproof.git

Then go into the project folder:

cd skillproof

---

## 2. Create Virtual Environment

Run the following command to create a Python virtual environment:

python -m venv venv

This creates an isolated Python environment for the project.

---

## 3. Activate Virtual Environment

### Windows (PowerShell)

venv\Scripts\Activate

After activation you should see something like this in your terminal:

(venv) PS C:...\skillproof>

### Mac / Linux

source venv/bin/activate

---

## 4. Install Project Dependencies

Once the virtual environment is active, install all required packages:

pip install -r requirements.txt

This installs the libraries needed for the project such as FastAPI, SQLModel, PostgreSQL driver, authentication libraries, and the Gemini API client.

---

## 5. Setup Environment Variables

Create a file named:

.env

Place it in the root folder of the project.

Inside the file add:

GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=any_random_secret_string



SkillProof uses Google Gemini AI to generate and evaluate questions.

Go to: https://aistudio.google.com

Sign in with your Google account

Click Get API Key

Create a new API key and copy it

This key will be used by the backend to access Gemini.

## 6. Setup PostgreSQL Database

Open **pgAdmin4** or PostgreSQL terminal and create a database:

CREATE DATABASE skillproof;

Make sure PostgreSQL is running.

If necessary, update the database connection settings in:

backend/database.py

Example:

DATABASE_URL = "postgresql://postgres:password@localhost:5432/skillproof"

Replace the username or password if your PostgreSQL configuration is different.

---

## 7. Start the Backend Server

Activate the virtual environment first (if it is not already active):

Windows:

venv\Scripts\Activate

Then start the FastAPI server:

uvicorn backend.main:app --reload

---



## 8. Stop the Server

To stop the backend server press:

CTRL + C

in the terminal.

---

## 9 Running the Project Again Later

Whenever you want to run the project again:

cd skillproof
venv\Scripts\Activate
uvicorn backend.main:app --reload

Then open:

http://127.0.0.1:8000/docs
