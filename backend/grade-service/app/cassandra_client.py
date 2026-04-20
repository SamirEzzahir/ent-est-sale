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

    cql = """
    CREATE TABLE IF NOT EXISTS grades (
        grade_id UUID PRIMARY KEY,
        student_id TEXT,
        course_id UUID,
        grade_type TEXT,
        score FLOAT,
        max_score FLOAT,
        label TEXT,
        recorded_by TEXT,
        record_date TIMESTAMP
    );
    """
    s.execute(cql)
    logger.info("Ensured grades table exists")


def init_db():
    _ensure_schema()
