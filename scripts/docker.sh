#!/bin/bash

uvicorn app.app.main:app --host 0.0.0.0 --port 8000 --reload