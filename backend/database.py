from sqlalchemy import text
from sqlmodel import SQLModel, create_engine

DATABASE_URL = "postgresql://postgres:rehanpro@localhost:5432/skillproof"

engine = create_engine(DATABASE_URL, echo=False)


def ensure_evaluation_result_uniqueness():
    with engine.begin() as connection:
        duplicate_rows = connection.execute(
            text(
                """
                SELECT response_id, COUNT(*)
                FROM evaluationresult
                GROUP BY response_id
                HAVING COUNT(*) > 1
                """
            )
        ).fetchall()

        if duplicate_rows:
            raise RuntimeError(
                "Cannot add unique index on evaluationresult.response_id because duplicate rows already exist."
            )

        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS
                uq_evaluationresult_response_id
                ON evaluationresult (response_id)
                """
            )
        )


def ensure_question_examples_column():
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE question
                ADD COLUMN IF NOT EXISTS examples_json JSON
                """
            )
        )


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    ensure_question_examples_column()
    ensure_evaluation_result_uniqueness()
