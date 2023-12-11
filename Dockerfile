# Create image based on the official Node image from dockerhub
FROM node:18.19 AS development
RUN apt update && apt upgrade -y
RUN apt install sudo curl zip unzip python3 python3.11-venv -y
RUN ln -s /usr/bin/python3 /usr/bin/python \
 && curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip" \
 && unzip awscli-bundle.zip \
 && sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws \
 && npm install -g serverless 

ENV LAMBDA_ROLE=arn:aws:iam::657907747545:role/service-role/StepFunction_uc1_Requirement-role-2coy70yw
RUN echo "Using lambda role: arn:aws:iam::657907747545:role/service-role/StepFunction_uc1_Requirement-role-2coy70yw"
RUN mkdir -p /app
WORKDIR /app
COPY workflow/ /app/workflow
WORKDIR /app/workflow
RUN serverless plugin install -n serverless-offline
CMD ["serverless", "deploy"]