import os
import logging
from cassandra.cluster import Cluster

logger = logging.getLogger(__name__)

cluster = None
session = None


def get_session():
    global cluster, session
    if session:
        return session

    host = os.getenv("CASSANDRA_HOST", "cassandra")
    port = int(os.getenv("CASSANDRA_PORT", 9042))
    keyspace = os.getenv("CASSANDRA_KEYSPACE", "ent")

    try:
        cluster = Cluster([host], port=port)
        session = cluster.connect()
        logger.info(f"Connected to Cassandra at {host}:{port}")
        return session
    except Exception as e:
        logger.error(f"Failed to connect to Cassandra: {e}")
        raise


def _ensure_schema():
    s = get_session()

    cql_keyspace = f"""
    CREATE KEYSPACE IF NOT EXISTS ent
      WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': 1}};
    """
    s.execute(cql_keyspace)
    logger.info("Ensured keyspace exists")

    s.set_keyspace('ent')

    tables = [
        """
        CREATE TABLE IF NOT EXISTS assignments (
            assignment_id UUID PRIMARY KEY,
            course_id UUID,
            title TEXT,
            description TEXT,
            created_by TEXT,
            due_date TIMESTAMP,
            max_grade FLOAT,
            created_date TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS submissions (
            submission_id UUID PRIMARY KEY,
            assignment_id UUID,
            student_id TEXT,
            filename TEXT,
            minio_path TEXT,
            submitted_date TIMESTAMP,
            status TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS assignment_grades (
            submission_id UUID PRIMARY KEY,
            student_id TEXT,
            assignment_id UUID,
            score FLOAT,
            feedback TEXT,
            graded_by TEXT,
            graded_date TIMESTAMP
        );
        """
    ]

    for cql in tables:
        s.execute(cql)

    logger.info("Ensured assignment tables exist")


def init_db():
    _ensure_schema()
