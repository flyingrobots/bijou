export const REVIEW_THREADS_QUERY = `
query($prNumber: Int!) {
  repository(owner: "flyingrobots", name: "bijou") {
    pullRequest(number: $prNumber) {
      reviewThreads(first: 100) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isResolved
          comments(first: 20) {
            nodes {
              author { login }
              body
              path
              url
            }
          }
        }
      }
    }
  }
}
`;

export const PULL_REQUEST_QUERY = `
query($prNumber: Int!) {
  repository(owner: "flyingrobots", name: "bijou") {
    pullRequest(number: $prNumber) {
      number
      title
      state
      baseRefName
      headRefName
      isDraft
      url
      reviewDecision
      mergeStateStatus
      comments(first: 100) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          body
          createdAt
          author { login __typename }
        }
      }
      reviews(first: 100) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          body
          submittedAt
          state
          author { login __typename }
        }
      }
    }
  }
}
`;
