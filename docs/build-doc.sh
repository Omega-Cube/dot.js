#!/bin/sh
MYDIR="$( cd "$( dirname "$0" )" && pwd )"
NaturalDocs --input $MYDIR/../dev --output HTML $MYDIR --project $MYDIR/project
