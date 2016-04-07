# loopback-component-roles
Component for [Loopback](http://loopback.io/), adding roles management to your User model.


More about Loopback components [here](https://docs.strongloop.com/display/public/LB/LoopBack+components)

## Usage
```
npm install --save loopback-component-roles
```
In `component-config.json` add
```
"loopback-component-roles": {
    "userModel": "MyUser"
    "adminEmail": "admin@mon-domaine.fr"
}
```
* When `MyUser` is the name of your custom User model (by default, build-in User model will be used).
* `adminEmail` is the mail you want for admin account (by default, test@test.fr)
* All options are optional

## Warnings
* If you want to see the method added in the explorer, take care of load the `loopback-component-explorer` after `loopback-component-roles`
in `component-config.json`

## What does this component do?
* Create a role `admin` if not exist
* Create an `admin` user (password by default: `admin`) if not exist
* Give role `admin` to `admin` user
* Create ACLs to allow `admin` manipulate roles and users
* Add relation `roles` to User model
* Add remote methods `addRole`, `removeRole`, `findByRole`, `getAllRoles`, `getPersistedRoles` to User model

## List of options
TODO
