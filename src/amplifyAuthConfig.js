export function getAmplifyAuthConfig(awsConfig) {
  const userPoolId = awsConfig?.aws_user_pools_id;
  const userPoolClientId = awsConfig?.aws_user_pools_web_client_id;

  if (!userPoolId || !userPoolClientId) {
    throw new Error('Cognito Auth requires a user pool ID and app client ID.');
  }

  return {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId
      }
    }
  };
}
