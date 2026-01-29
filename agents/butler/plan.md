# Butler Agent Development Plan

## Overview
Build a butler agent that connects to Outlook and Gmail to summarize daily inbox digest, identify attention/actions needed, and create tasks in Microsoft ToDo.

---
## Phase 0: Technology
- [x] Use TypeScript
- [x] Use MSAL

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Project
- [x] Create it under agents/butler folder
- [x] Initialize pnpm project (`pnpm init`)
- [x] Set up project structure (src/, tests/, etc.)
- [x] Create `.gitignore` file
- [x] Create initial README.md

### 1.2 Development Tools Setup
- [x] Install and configure ESLint 9
- [x] Set up ESLint configuration file
- [x] Add lint scripts to package.json
- [x] Set up TypeScript (if using) or configure JavaScript project
- [x] Add development dependencies (testing framework, etc.)

### 1.3 Environment Configuration
- [x] Create `.env.example` file
- [x] Set up environment variable management
- [x] Document required environment variables

### 1.4 Library dependency management
- [x] Add dependencies (MSAL, Graph, googleapis, openai)

---

## Phase 2: Microsoft Outlook Integration

### 2.1 Microsoft Authentication Setup
- [x] Research Microsoft Graph API authentication (no username/password)
- [ ] Set up Azure AD App Registration (manual in portal)
- [x] Implement Microsoft authentication flow (OAuth/MSAL)
- [x] Store and manage authentication tokens securely
- [x] Add unit tests for authentication (via orchestrator mock)

### 2.2 Outlook Email Access
- [x] Implement Microsoft Graph API client
- [x] Create service to fetch emails from Outlook inbox
- [x] Implement email filtering (daily digest scope)
- [x] Add error handling for API calls
- [ ] Add unit tests for email fetching (outlook service mocked)

---

## Phase 3: Gmail Integration

### 3.1 Google OAuth Setup
- [ ] Research Google Gmail API OAuth 2.0 flow
- [ ] Set up Google Cloud Project and OAuth credentials
- [ ] Implement Google OAuth authentication flow
- [ ] Store and manage OAuth tokens securely
- [ ] Add unit tests for OAuth flow

### 3.2 Gmail Email Access
- [ ] Implement Gmail API client
- [ ] Create service to fetch emails from Gmail inbox
- [ ] Implement email filtering (daily digest scope)
- [ ] Add error handling for API calls
- [ ] Add unit tests for email fetching

---

## Phase 4: Email Processing & Summarization

### 4.1 Email Data Models
- [x] Define email data structure/models
- [x] Create unified email interface (for Outlook and Gmail)
- [x] Implement email parsing utilities
- [x] Add unit tests for data models

### 4.2 Email Summarization
- [x] Set up Azure OpenAI client
- [x] Implement email summarization logic
- [x] Create prompt engineering for daily digest
- [x] Identify attention/action items from emails
- [x] Add unit tests for summarization logic

### 4.3 Daily Digest Generation
- [x] Implement daily digest aggregation
- [x] Combine emails from both sources (Outlook + Gmail)
- [x] Format digest output
- [x] Add unit tests for digest generation (orchestrator)

---

## Phase 5: Microsoft ToDo Integration

### 5.1 Microsoft ToDo API Setup
- [ ] Research Microsoft ToDo API
- [ ] Implement ToDo API client
- [ ] Set up authentication (reuse Microsoft auth if possible)
- [ ] Add unit tests for ToDo API client

### 5.2 Task Creation
- [ ] Implement daily todo task creation
- [ ] Create one main task with sub-tasks from action items
- [ ] Sub-task name should be the email title and notes should contain sender and email summary
- [ ] Map email action items to ToDo tasks
- [ ] Add error handling
- [ ] Add unit tests for task creation

---

## Phase 6: End-to-End Integration

### 6.1 Main Butler Agent Logic
- [x] Create main butler agent orchestrator
- [x] Implement daily digest workflow:
  - Fetch emails from Outlook
  - Fetch emails from Gmail
  - Summarize and identify actions
  - Create ToDo tasks
- [x] Add logging and error handling
- [x] Add configuration management

### 6.2 Scheduling/Triggering
- [ ] Decide on execution method (cron, scheduled job, manual trigger)
- [ ] Implement execution mechanism
- [ ] Add CLI or API endpoint for manual triggers (if needed)

---

## Phase 7: Testing

### 7.1 Unit Tests
- [ ] Write unit tests for all services
- [ ] Write unit tests for utilities
- [ ] Achieve good test coverage
- [ ] Set up test scripts in package.json

### 7.2 End-to-End Tests
- [ ] Set up e2e test framework
- [ ] Configure Azure OpenAI for e2e tests
- [ ] Create e2e test scenarios:
  - Full flow: Outlook → Summarize → ToDo
  - Full flow: Gmail → Summarize → ToDo
  - Combined flow: Both → Summarize → ToDo
- [ ] Add test data/mocks as needed
- [ ] Document e2e test setup

---

## Phase 8: CI/CD

### 8.1 GitHub Actions Setup
- [x] Create `.github/workflows/` directory
- [x] Set up CI workflow for:
  - Running unit tests
  - Running e2e tests
  - Running ESLint
  - Verifying all tests pass
- [ ] Configure secrets management in GitHub
- [ ] Add workflow badges to README

### 8.2 CI/CD Configuration
- [x] Set up test environment variables in GitHub Actions
- [x] Configure Azure OpenAI access for e2e tests (secrets)
- [x] Add conditional test execution (e2e on push to main only)
- [ ] Document CI/CD process

---

## Phase 9: Documentation & Polish

### 9.1 Documentation
- [ ] Update README with setup instructions
- [ ] Document authentication setup for both providers
- [ ] Add usage examples
- [ ] Document environment variables
- [ ] Add architecture/flow diagrams (if helpful)

### 9.2 Code Quality
- [ ] Run ESLint and fix all issues
- [ ] Review and refactor code
- [ ] Add code comments where needed
- [ ] Ensure consistent code style

---

## Open Questions Requiring User Input

1. **Authentication Method for Microsoft:**
   - Should we use MSAL (Microsoft Authentication Library) or direct OAuth?
   - What type of Azure AD app registration is preferred (single-tenant vs multi-tenant)?

2. **Execution Frequency:**
   - How often should the daily digest run? (Once per day at a specific time?)
   - Should it be a scheduled job, cron, or manually triggered?
Answer: Daily at midnight for the past day

3. **Email Filtering:**
   - What defines "daily digest"? (Last 24 hours? Emails from today?)
   - Should we filter by specific criteria (unread only, specific folders/labels)?
Answer: Last 24 hours

4. **Summarization Details:**
   - What level of detail is needed in the summary?
   - Should we include all emails or only important ones?
   - What criteria define "attention/action needed"?

5. **Microsoft ToDo Integration:**
   - Which ToDo list should tasks be added to? (Default "My Day" or a specific list?)
   - Should we create a new list for butler-generated tasks?
   - What should the main task title be? (e.g., "Daily Email Digest - [Date]")

6. **Error Handling:**
   - What should happen if one email provider fails but the other succeeds?
   - Should we retry failed operations?
Answer 
   - How should we handle rate limiting from APIs?

7. **Storage:**
   - Do we need to store processed emails to avoid duplicates?
   - Should we maintain a history of digests?

8. **Technology Stack:**
   - Preferred language? (TypeScript, JavaScript, Python, etc.)
   - Any specific frameworks or libraries preferred?

---

## Notes

- Commit often with descriptive commit messages
- Each phase should be completed and tested before moving to the next
- Keep authentication credentials secure (use environment variables, never commit)
- Consider rate limits for both Microsoft Graph API and Gmail API


