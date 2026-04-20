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

    cql_keyspace = """
    CREATE KEYSPACE IF NOT EXISTS ent
      WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
    """
    s.execute(cql_keyspace)
    s.set_keyspace('ent')

    tables = [
        """
        CREATE TABLE IF NOT EXISTS class_schedule (
            schedule_id UUID PRIMARY KEY,
            course_id UUID,
            day_of_week TEXT,
            start_time TEXT,
            end_time TEXT,
            room TEXT,
            teacher_id TEXT,
            academic_year TEXT,
            semester INT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS exams (
            exam_id UUID PRIMARY KEY,
            course_id UUID,
            title TEXT,
            exam_date TIMESTAMP,
            duration_minutes INT,
            room TEXT,
            exam_type TEXT,
            created_by TEXT
        );
        """
    ]

    for cql in tables:
        s.execute(cql)

    logger.info("Ensured schedule tables exist")


def init_db():
    _ensure_schema()
