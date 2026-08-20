## Commands (Tested on Ubuntu 24.04.4 LTS)

### Install Terraform CLI
```
$ sudo apt-get update && sudo apt-get install -y gnupg software-properties-common

$ wget -O- https://apt.releases.hashicorp.com/gpg | \
gpg --dearmor | \
sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null

$ gpg --no-default-keyring \
--keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg \
--fingerprint

$ echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

$ sudo apt update && sudo apt-get install terraform && terraform -install-autocomplete
```

### Install AWS CLI
```
$ curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

$ unzip awscliv2.zip && sudo ./aws/install

$ rm -rf awscliv2.zip aws
```

### AWS CLI commands
```
$ aws sts get-caller-identity   // See current profile
```

### Install SSM plugin to start sessions
```
$ curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" \
  -o session-manager-plugin.deb
$ sudo dpkg -i session-manager-plugin.deb
$ rm session-manager-plugin.deb
```

### Start an SSM Session
```
$ aws ssm start-session --profile personal --target "$(aws ec2 describe-instances --profile personal --filters "Name=instance-state-name,Values=running" --query 'Reservations[].Instances[].InstanceId' --output text)"
```
