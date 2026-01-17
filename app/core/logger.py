import logging
import sys

LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"

def get_logger(name):
    """
    Configure et retourne un logger pour un module spécifique.
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(logging.INFO)

        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(logging.Formatter(LOG_FORMAT))

        logger.addHandler(console_handler)

        logger.propagate = False

    return logger