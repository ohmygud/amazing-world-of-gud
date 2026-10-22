#!/bin/bash
# Apre Sandman FX in Google Chrome (doppio clic su Mac)
cd "$(dirname "$0")"
open -a "Google Chrome" "SandmanFX.html" || open "SandmanFX.html"
