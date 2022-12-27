#!/bin/sh

BACKUP_FOLDER=/backup
# NOW=-$(date +"%Y-%m-%dT%H-%M-%SZ")
NOW=


GZIP=$(which gzip)
MYSQLDUMP=$(which mysqldump)

[ ! -d "$BACKUP_FOLDER" ] && mkdir --parents $BACKUP_FOLDER

FILE=${BACKUP_FOLDER}/backup${NOW}.sql.gz
$MYSQLDUMP -h db -u root -proot --databases parts | $GZIP -9 > $FILE