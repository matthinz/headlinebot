import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Artifact, Logger, Plugin, State } from "../types";

type S3PluginOptions = {
  bucket: string;
  endpoint?: string;
  logger: Logger;
  region?: string;
};

export function s3Plugin(options: S3PluginOptions): Plugin {
  return async (state: State): Promise<State> => {
    const client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
    });

    await Promise.all(
      (state.artifacts ?? [])
        .filter((a) => a.isPublic)
        .map(async (artifact) => putObject(client, options, artifact))
    );

    return state;
  };
}

async function putObject(
  client: S3Client,
  { bucket, logger }: S3PluginOptions,
  {
    name,
    contentType,
    content,
  }: Pick<Artifact, "name" | "contentType" | "content">
): Promise<void> {
  const params: PutObjectCommandInput = {
    Key: name,
    ContentType: contentType,
    Body: content,
    Bucket: bucket,
  };

  const command = new PutObjectCommand(params);

  logger.debug("Uploading %s to %s", name, bucket);

  await client.send(command);
}
