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
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id UUID PRIMARY KEY,
            user_id TEXT,
            type TEXT,
            title TEXT,
            message TEXT,
            read BOOLEAN,
            created_date TIMESTAMP,
            link TEXT
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS announcements (
            announcement_id UUID PRIMARY KEY,
            course_id UUID,
            title TEXT,
            content TEXT,
            created_by TEXT,
            created_date TIMESTAMP,
            pinned BOOLEAN
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS messages (
            message_id UUID PRIMARY KEY,
            sender_id TEXT,
            recipient_id TEXT,
            subject TEXT,
            content TEXT,
            sent_date TIMESTAMP,
            read BOOLEAN
        );
        """
    ]

    for cql in tables:
        s.execute(cql)

    logger.info("Ensured notification tables exist")


def init_db():
    _ensure_schema()
