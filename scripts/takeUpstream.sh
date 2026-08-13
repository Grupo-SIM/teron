#!/bin/bash

git subtree pull --prefix=foundations/utils git@github.com:hcengineering/teron.utils.git main
git subtree pull --prefix=foundations/core git@github.com:hcengineering/teron.core.git main
git subtree pull --prefix=foundations/server git@github.com:hcengineering/teron.server.git main
git subtree pull --prefix=foundations/net git@github.com:hcengineering/teron.net.git main

git subtree pull --prefix=foundations/teronlake git@github.com:hcengineering/teronlake.git master
git subtree pull --prefix=foundations/hulypulse git@github.com:hcengineering/hulypulse.git main
git subtree pull --prefix=foundations/communication git@github.com:hcengineering/communication.git main
