# Fix: Contract Artifact Not Found Error

## Problem
Backend service was failing to start with error:
```
Error: Contract artifact not found. Run: npx hardhat compile
```

## Root Cause
1. The Hardhat smart contracts were not being compiled during Docker build process
2. The volume mount `./backend:/app` was overwriting the compiled artifacts directory

## Solution Implemented
✅ **Step 1**: Added Hardhat compilation step to `backend/Dockerfile.dev`
- Added `RUN npx hardhat compile` after Prisma generate step
- This creates the `artifacts/` directory with compiled contract ABIs during image build

✅ **Step 2**: Protected artifacts directory in `docker-compose.dev.yaml`
- Added `/app/artifacts` volume mount to prevent host directory from overwriting compiled contracts
- Similar to how `/app/node_modules` is protected

## Files Modified
- [x] `backend/Dockerfile.dev` - Added Hardhat compilation step
- [x] `docker-compose.dev.yaml` - Added artifacts directory protection

## Next Steps
1. Rebuild Docker containers: `make stop && make dev`
2. Verify backend starts successfully without artifact error
3. Confirm blockchain service initializes with "✅ Blockchain service initialized" message

## Status
✅ Complete fix implemented - Ready for testing
