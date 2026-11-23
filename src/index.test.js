const mockRender = jest.fn();

jest.mock('react-dom/client', () => ({
  __esModule: true,
  default: {
    createRoot: jest.fn(() => ({
      render: mockRender
    }))
  }
}));

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn()
  }
}));

jest.mock('./App', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./aws-exports', () => ({
  __esModule: true,
  default: {
    aws_user_pools_id: 'us-east-1_fAO8zL6Gx',
    aws_user_pools_web_client_id: '2ufqqplj9s5n1p9e93is8c5b9h'
  }
}));

jest.mock('./reportWebVitals', () => jest.fn());

const { Amplify } = jest.requireMock('aws-amplify');

beforeEach(() => {
  jest.clearAllMocks();
  mockRender.mockClear();
  document.body.innerHTML = '<div id="root"></div>';
});

test('configures Cognito with the v6 user pool shape before mounting the signup app', () => {
  const previousMockAuth = process.env.REACT_APP_MOCK_AUTH;
  delete process.env.REACT_APP_MOCK_AUTH;

  try {
    jest.isolateModules(() => {
      require('./index');
    });

    expect(Amplify.configure).toHaveBeenCalledWith({
      Auth: {
        Cognito: {
          userPoolId: 'us-east-1_fAO8zL6Gx',
          userPoolClientId: '2ufqqplj9s5n1p9e93is8c5b9h'
        }
      }
    });
    expect(Amplify.configure.mock.invocationCallOrder[0]).toBeLessThan(
      mockRender.mock.invocationCallOrder[0]
    );
  } finally {
    if (previousMockAuth === undefined) {
      delete process.env.REACT_APP_MOCK_AUTH;
    } else {
      process.env.REACT_APP_MOCK_AUTH = previousMockAuth;
    }
  }
});
