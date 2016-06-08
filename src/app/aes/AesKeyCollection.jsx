import React  from 'react';
import RsaKey from '../components/RsaKey.jsx';
import AesKey from '../components/AesKey.jsx';

import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import {blue100, cyanA400, lightBlue500} from 'material-ui/styles/colors';
import Subheader from 'material-ui/Subheader';
import transitions from 'material-ui/styles/transitions';

class AesKeyCollection extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            expand: false
        };
    };

    // react function to test if props and/or state have changed
    shouldComponentUpdate(nextProps, nextState) {
        // check if state has changed
        if (JSON.stringify(this.state) !== JSON.stringify(nextState) || JSON.stringify(nextProps) !== JSON.stringify(this.props)) {
            return true;
        }
        return false;
    };

    render() {
        // easier handling
        var Username = this.props.userKey.rsa_keys.username;
        var AesKeyVar = this.props.userKey.key;
        var PublicKey = this.props.userKey.rsa_keys.public_key;
        var PublicKeySign = this.props.userKey.rsa_keys.public_key_sign;

        return (
            <div className="col-xs-12">
                <div className="box-row">
                    <Card className="box-row">
                        <CardHeader
                            title={Username}
                            style={{background: cyanA400}}
                            actAsExpander={true}
                            showExpandableButton={true}
                        />
                        <CardText
                            expandable={true}
                            style={{background: lightBlue500}}
                        >
                            <div className="row">

                                <div className="col-xs-12">
                                    <div className="box-row">
                                        <div className="row">

                                            <div className="col-xs-12">
                                                <div className="box-row">
                                                    <Subheader>AES key</Subheader>
                                                    <AesKey nameTag={Username + "aesKey"}
                                                            aesKey={AesKeyVar}/>
                                                </div>
                                            </div>

                                            <div className="col-xs-12 col-sm-6">
                                                <div className="box-row">
                                                    <Subheader>Public Encryption Key</Subheader>
                                                    <RsaKey nameTag={Username + "publicEncryptionKey"}
                                                            rsaKey={PublicKey}/>
                                                </div>
                                            </div>

                                            <div className="col-xs-12 col-sm-6">
                                                <div className="box-row">
                                                    <Subheader>Public Verification Key</Subheader>
                                                    <RsaKey nameTag={Username + "publicVerificationKey"}
                                                            rsaKey={PublicKeySign}/>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                            </div>
                        </CardText>
                    </Card>
                </div>
            </div>
        );
    };
}


export default AesKeyCollection;