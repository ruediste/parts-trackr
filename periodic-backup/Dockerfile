FROM ubuntu:22.04

RUN apt-get update && \
    apt-get -y install cron mariadb-client && \
    apt-get clean

COPY backup-database.sh /root/

RUN chmod a+x /root/*.sh && \
    echo "*/15 * * * * /root/backup-database.sh"| crontab -

CMD cron -f