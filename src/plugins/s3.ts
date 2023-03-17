import AWS from "aws-sdk";
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { Artifact, Logger, Plugin, State } from "../types";

type S3PluginOptions = {
  bucket: string;
  endpoint?: string;
  logger: Logger;
  region?: string;
};

export function s3Plugin(options: S3PluginOptions): Plugin {
  return async (state: State): Promise<State> => {
    const s3 = new AWS.S3({
      endpoint: options.endpoint,
      region: options.region,
    });

    await Promise.all(
      (state.artifacts ?? [])
        .filter((a) => a.isPublic)
        .map(async (artifact) => putObject(s3, options, artifact))
    );

    return state;
  };
}

function putObject(
  s3: AWS.S3,
  { bucket, logger }: S3PluginOptions,
  {
    name,
    contentType,
    content,
  }: Pick<Artifact, "name" | "contentType" | "content">
): Promise<void> {
  return new Promise((resolve, reject) => {
    const params: PutObjectRequest = {
      Key: name,
      ContentType: contentType,
      Body: content,
      Bucket: bucket,
    };

    logger.debug("Uploading %s to %s", name, bucket);

    s3.putObject(params, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
